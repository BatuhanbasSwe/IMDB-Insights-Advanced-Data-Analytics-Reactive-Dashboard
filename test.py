import unittest
from dataclasses import asdict
from main import IMDbContent
from databasemanager import MongoDBManager
from new_scraper import IMDbScraper


class TestIMDbProject(unittest.TestCase):
    """
    Robustness Tests for IMDb Project.
    These tests ensure the core logic handles data correctly and components initialize safely.
    """

    def test_01_data_class_integrity(self):
        """Test if Data Class correctly handles data structure."""
        print("\nTesting Data Class Integrity...")
        movie = IMDbContent(title="Inception", rating=8.8, year=2010, category="Test")
        result = asdict(movie)

        self.assertEqual(result['title'], "Inception")
        self.assertEqual(result['rating'], 8.8)
        self.assertEqual(result['watched'], False)  # Default value check
        print("✅ Data Class passed.")

    def test_02_scraper_initialization(self):
        """Test if Scraper initializes without crashing (Headless Mode)."""
        print("\nTesting Scraper Initialization...")
        try:
            scraper = IMDbScraper(headless=True)
            self.assertIsNotNone(scraper.driver)
            scraper.close()
            print("✅ Scraper initialized and closed successfully.")
        except Exception as e:
            self.fail(f"Scraper crashed during init: {e}")

    def test_03_database_connection_failure_handling(self):
        """Test if Database Manager handles bad connection strings gracefully."""
        print("\nTesting Database Error Handling...")
        # Yanlış bir URI veriyoruz, kodun çökmemesi lazım (False dönmeli)
        fake_uri = "mongodb+srv://fake_user:wrong_pass@cluster0.fake.mongodb.net/"
        manager = MongoDBManager(fake_uri, "TestDB", "TestCol")

        result = manager.connect()
        self.assertFalse(result)  # Bağlantı başarısız olmalı ama ÇÖKMEMELİ
        print("✅ Database connection error handled gracefully.")


if __name__ == '__main__':
    unittest.main()