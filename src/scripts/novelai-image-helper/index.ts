import { bootstrap } from './app/bootstrap';
import { createLogger } from './app/logger';

const logger = createLogger('entry');

$(() => {
  errorCatched(() => {
    try {
      return bootstrap();
    } catch (error) {
      logger.error('图片助手初始化失败', error);
      throw error;
    }
  })();
});
