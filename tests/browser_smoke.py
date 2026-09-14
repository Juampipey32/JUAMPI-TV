from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json

Path('artifacts').mkdir(exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel='chrome')
    page = browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://localhost:5178')
    page.wait_for_selector('.card')
    page.wait_for_load_state('networkidle')
    assert page.locator('.card').count()==48
    page.get_by_role('button',name='Argentina',exact=True).click()
    assert page.locator('.card').count()>10
    page.get_by_role('searchbox').fill('Cine.AR')
    assert page.locator('.card').count()==1
    page.locator('[data-favorite]').click()
    page.get_by_role('button',name='Mi lista',exact=True).first.click()
    assert page.locator('.card').count()==1
    page.reload()
    page.wait_for_selector('.card')
    page.get_by_role('button',name='Mi lista',exact=True).first.click()
    assert page.locator('.card').count()==1
    page.get_by_role('button',name='TV en vivo',exact=True).click()
    page.get_by_role('searchbox').fill('Canal 26')
    page.get_by_role('button',name='Ver Canal 26',exact=True).click()
    live=False
    try:
        page.wait_for_function('document.querySelector("video").getVideoPlaybackQuality().totalVideoFrames > 15 && !document.querySelector("video").paused',timeout=30000)
        live=True
    except Exception:
        pass
    print(json.dumps({'live_canal26':live,'status':page.locator('#player-status').inner_text(),'video':page.locator('video').evaluate('(v)=>({width:v.videoWidth,time:v.currentTime,ready:v.readyState})')}))
    page.screenshot(path='artifacts/player.png')
    page.get_by_role('button',name='Cerrar reproductor').click()
    assert page.locator('video').evaluate('(v)=>v.paused && !v.getAttribute("src")')
    page.get_by_role('button',name='Recientes',exact=True).click()
    assert page.locator('.card').count()==1
    page.get_by_role('searchbox').fill('')
    page.get_by_role('button',name='Agregar lista',exact=True).click()
    page.locator('#file').set_input_files({'name':'test.m3u','mimeType':'text/plain','buffer':b'#EXTM3U\n#EXTINF:-1 group-title="Prueba",Canal de prueba\nhttps://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'})
    expect(page.locator('.card')).to_have_count(1)
    expect(page.locator('.card')).to_contain_text('Canal de prueba')
    page.reload()
    expect(page.locator('.card')).to_have_count(1)
    page.get_by_role('button',name='Agregar lista',exact=True).click()
    page.get_by_role('button',name='Volver al catálogo Free-TV').click()
    expect(page.locator('.card')).to_have_count(48)
    page.get_by_role('button',name='Inicio',exact=True).click()
    page.get_by_role('searchbox').fill('canal-inexistente-xyz')
    expect(page.locator('.empty')).to_be_visible()
    page.get_by_role('searchbox').fill('')
    page.wait_for_timeout(1500)
    page.screenshot(path='artifacts/desktop.png')
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path='artifacts/mobile.png')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.get_by_role('button',name='Mi lista',exact=True).first.click()
    expect(page.locator('.card')).to_have_count(1)
    assert not errors, errors
    print('PASS: catalogo, busqueda, filtros, favoritos persistentes, historial, importacion persistente, restauracion, cierre de video y mobile sin overflow. Errores JS: 0.')
    browser.close()
