import './style.scss';
import { clamp } from 'lodash';
import { createRoot } from 'react-dom/client';

console.info(clamp(2, 0, 1), createRoot);
