import {installErrorLogs} from '../error-log';
import {createElement} from 'react';
import {renderView} from './render';
import {AdminPage} from './admin';
import {mountRuntimeSetup} from '../runtime-setup';
installErrorLogs();
renderView(document.getElementById('studio-root')!,createElement(AdminPage));
mountRuntimeSetup(false);
