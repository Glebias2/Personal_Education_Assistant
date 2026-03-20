import io
import re
import asyncio
from typing import Optional

import aiohttp
from bs4 import BeautifulSoup
from urllib.parse import urljoin

from .models import Report
from log import logger


class ReportDownloader:
    def __init__(self):
        self.__session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        self.__session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.__session:
            await self.__session.close()

    async def _download_image(self, image_url: str) -> Optional[io.BytesIO]:
        """Loads an image from a URL and returns a buffer with the data"""
        if not self.__session:
            raise RuntimeError("Session not initialized. Use async context manager")

        try:
            async with self.__session.get(image_url) as response:
                response.raise_for_status()
                image_data = await response.read()
                return io.BytesIO(image_data)
        except Exception as e:
            logger.error(f"Error loading image {image_url}: {e}")
            return None

    async def download_report(self, report_link: str) -> Report:
        if not self.__session:
            raise RuntimeError("Session not initialized. Use async context manager")

        # Извлекаем ID отчета
        match = re.search(r"/d/([a-zA-Z0-9_-]+)", report_link)
        if not match:
            raise ValueError(f"Invalid report link: {report_link}")
        
        report_id = match.group(1)
        url = f'https://docs.google.com/document/d/{report_id}/export?format=html'

        async with self.__session.get(url) as response:
            response.raise_for_status()
            html = await response.text()

        soup = BeautifulSoup(html, "lxml")
        img_tags = soup.find_all('img')

        images = []
        for img in img_tags:
            if src := img.get('src'):
                full_url = urljoin(url, src)
                images.append(self._download_image(full_url))
        
        image_buffers = await asyncio.gather(*images)

        return Report(
            text=soup.get_text(),
            images=[img for img in image_buffers if img is not None]
        )