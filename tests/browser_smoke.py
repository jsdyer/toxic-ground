"""Exercise the built starter at a project subpath in Chromium."""
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import tempfile
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    screenshots = ROOT / "browser-checks"
    screenshots.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as temporary:
        shutil.copytree(ROOT / "dist", Path(temporary) / "example-tool")
        server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=temporary))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH"))
                page = browser.new_page(viewport={"width": 1280, "height": 1000})
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{server.server_port}/example-tool/")
                page.wait_for_selector("#recordlist button")
                assert page.locator(".leaflet-container").count() == 1
                page.locator("#order").select_option(index=1)
                assert page.locator("#recordlist button").count()>0
                page.locator("#query").fill("zzzz-no-such-match")
                page.wait_for_function("document.querySelector('#count').textContent.startsWith('0 matching')")
                page.locator("#clear").click()
                page.locator("#recordlist button").first.wait_for()
                page.locator("#recordlist button").nth(1).click()
                assert "?region=" in page.url and "id=" in page.url
                assert page.locator("#detail h2").inner_text().strip()
                with page.expect_download() as result:
                    page.click("#export")
                assert result.value.suggested_filename.endswith(".csv")
                page.select_option("#region","NS")
                page.locator("#query").fill("00008521")
                page.wait_for_function("document.querySelector('#detail h2')?.textContent.toLowerCase().includes('willow park')")
                assert "Fiscal history" in page.locator("#detail").inner_text()
                page.reload()
                page.wait_for_function("document.querySelector('#detail h2')?.textContent.toLowerCase().includes('willow park')")
                page.screenshot(path=str(screenshots / "desktop.png"))
                page.set_viewport_size({"width":390,"height":844})
                assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
                page.screenshot(path=str(screenshots / "mobile.png"))
                assert not errors, errors
                browser.close()
            print("Browser checks passed: map, filters, record links, CSV and mobile layout")
        finally:
            server.shutdown()


if __name__ == "__main__":
    main()
