import './style.scss';
import { clamp } from 'lodash';
import { createRoot } from 'react-dom/client';

class ScriptFixture {
  value = clamp(2, 0, 1);
}

console.info(new ScriptFixture().value, createRoot);
