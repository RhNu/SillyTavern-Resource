import { bootstrapImageGenerationHelperV2 } from '@/ImageGenerationHelperV2/app/bootstrap';

$(() => {
  errorCatched(() => {
    bootstrapImageGenerationHelperV2();
  })();
});
