"""
Database Manager Module.
Handles all interactions with the MongoDB Atlas database,
including connection, data insertion (upsert), and retrieval.
"""

import datetime
import logging
from pymongo import MongoClient

# Configure logging
logging.basicConfig(
    filename='db_connection.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)


class MongoDBManager:
    """Class to manage MongoDB operations."""

    def __init__(self, uri, db_name, collection_name):
        """Initializes the database manager with connection details."""
        self.uri = uri
        self.db_name = db_name
        self.collection_name = collection_name
        self.client = None
        self.db = None
        self.collection = None

    def connect(self):
        """Establishes connection to MongoDB."""
        try:
            self.client = MongoClient(self.uri)
            # Test connection
            self.client.admin.command('ping')
            self.db = self.client[self.db_name]
            self.collection = self.db[self.collection_name]
            message = f"--> Connection Successful! Target: {self.db_name} -> {self.collection_name}"
            print(message)
            logging.info(message)
            return True
        except Exception as e:  # pylint: disable=broad-except
            message = f"---> Connection Failed: {e}"
            print(message)
            logging.error(message)
            return False

    def insert_data(self, data_dict, rank=None):
        """
        Inserts or updates data in the collection.
        Uses upsert=True to prevent duplicates based on title.
        """
        if self.collection is not None:
            data_dict["created_at"] = datetime.datetime.now()
            try:
                # Update if exists, insert if new
                self.collection.update_one(
                    {"title": data_dict["title"]},
                    {"$set": data_dict},
                    upsert=True
                )

                title = data_dict.get('title', 'Unknown')
                rating = data_dict.get('rating', 0.0)

                if rank:
                    print(f"{rank} - {title} | {rating}")
                else:
                    print(f"{title} | {rating}")
            except Exception as e:  # pylint: disable=broad-except
                print(f"Error inserting data: {e}")
        else:
            print("--> Connection not established yet!")
