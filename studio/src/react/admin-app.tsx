import {createElement} from 'react';
import {renderView} from './render';
import {AdminPage} from './admin';
import {mountRuntimeSetup} from '../runtime-setup';
renderView(document.getElementById('studio-root')!,createElement(AdminPage));
mountRuntimeSetup(false);
