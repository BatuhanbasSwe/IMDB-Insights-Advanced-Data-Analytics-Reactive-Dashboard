"""
IMDb Scraper Module.
This module uses Selenium to scrape dynamic content from IMDb charts and search pages.
It handles scrolling, button clicks, and data extraction.
"""

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager


class IMDbScraper:
    """Scraper class to handle Selenium WebDriver and IMDb page interaction."""

    def __init__(self, headless=False):
        """Initializes the Chrome WebDriver with options."""
        chrome_options = Options()
        if headless:
            chrome_options.add_argument("--headless")

        # Anti-detection and stability settings
        chrome_options.add_argument("--lang=en-US")
        prefs = {
            "intl.accept_languages": "en-US,en",
            "profile.default_content_setting_values.notifications": 2
        }
        chrome_options.add_experimental_option("prefs", prefs)
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        )

        print(" Initializing Selenium WebDriver...")
        self.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )

    def scrape_data(self, chart_url, limit=50):
        """
        Scrapes movie/show data from the given URL.
        Args:
            chart_url (str): The IMDb URL to scrape.
            limit (int): The maximum number of items to fetch.
        Returns:
            list: A list of dictionaries containing movie data.
        """
        print(f" Connecting to IMDb via Selenium: {chart_url}")
        self.driver.get(chart_url)
        extracted_data = []

        try:
            print(" Waiting for page to load...")
            # Wait for either list format
            try:
                WebDriverWait(self.driver, 15).until(
                    lambda d: d.find_elements(By.CLASS_NAME, "ipc-metadata-list-summary-item") or
                              d.find_elements(By.CLASS_NAME, "ipc-metadata-list")
                )
            except Exception:  # pylint: disable=broad-except
                print("Warning: Page took too long to load or no items found.")

            while len(extracted_data) < limit:
                # Try to find items using the 'Search' page class
                items = self.driver.find_elements(By.CLASS_NAME, "ipc-metadata-list-summary-item")

                # Fallback: Try the 'Chart' page class
                if not items:
                    ul_list = self.driver.find_elements(By.CLASS_NAME, "ipc-metadata-list")
                    if ul_list:
                        items = ul_list[0].find_elements(By.TAG_NAME, "li")

                if not items:
                    print(" No items found on current view.")
                    break

                for item in items:
                    if len(extracted_data) >= limit:
                        break

                    try:
                        # Extract Title
                        try:
                            title_el = item.find_element(By.CLASS_NAME, "ipc-title__text")
                            raw_title = title_el.text.strip()
                            if ". " in raw_title:
                                title = raw_title.split(". ", 1)[1]
                            else:
                                title = raw_title
                        except Exception:  # pylint: disable=broad-except
                            title = "Unknown"

                        # Avoid duplicates
                        if any(d['title'] == title for d in extracted_data):
                            continue

                        # Extract Rating
                        try:
                            rating_el = item.find_element(By.CLASS_NAME, "ipc-rating-star--rating")
                            rating = float(rating_el.text)
                        except Exception:  # pylint: disable=broad-except
                            rating = 0.0

                        # Extract Year
                        try:
                            metas = item.find_elements(By.CLASS_NAME, "dli-title-metadata-item")
                            if not metas:
                                metas = item.find_elements(By.CLASS_NAME, "cli-title-metadata-item")
                            year = 0
                            for m in metas:
                                txt = m.text.strip()
                                if txt.isdigit() and len(txt) == 4:
                                    year = int(txt)
                                    break
                        except Exception:  # pylint: disable=broad-except
                            year = 0

                        data = {"title": title, "rating": rating, "year": year}
                        extracted_data.append(data)
                    except Exception:  # pylint: disable=broad-except
                        continue

                if len(extracted_data) >= limit:
                    break

                # Handle "Load More" button for infinite scroll pages
                try:
                    self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(2)
                    load_more_btn = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.CLASS_NAME, "ipc-see-more__button"))
                    )
                    self.driver.execute_script("arguments[0].click();", load_more_btn)
                    print(f" Loading more items... (Current: {len(extracted_data)})")
                    time.sleep(3)
                except Exception:  # pylint: disable=broad-except
                    # If button not found, we might have reached the end
                    break

            print(f" Successfully fetched {len(extracted_data)} items.")
            return extracted_data

        except Exception as e:  # pylint: disable=broad-except
            print(f"Scraper Error: {e}")
            return extracted_data

    def close(self):
        """Closes the Selenium WebDriver."""
        try:
            self.driver.quit()
        except Exception:  # pylint: disable=broad-except
            pass
