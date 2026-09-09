import { bootstrapImageGenerationHelperV2 } from '@/ImgGenHelper/app/bootstrap';

$(() => {
  errorCatched(() => {
    bootstrapImageGenerationHelperV2();
  })();
});
