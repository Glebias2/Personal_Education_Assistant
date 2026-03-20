from loguru import logger

LOG_FORMAT = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "\
        "<level>{level: <8}</level> | "\
        "<cyan>{file.name}</cyan>:<cyan>{line}</cyan> | <white>{function}</white> - "\
        "<level>{message}</level>"

logger.remove()

logger.add(
    sink=lambda msg: print(msg, end=""),
    format=LOG_FORMAT,
    colorize=True,
    level="TRACE",
)
