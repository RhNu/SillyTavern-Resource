import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import minify from 'postcss-minify';

export default {
  plugins: [autoprefixer(), tailwindcss(), minify()],
};
