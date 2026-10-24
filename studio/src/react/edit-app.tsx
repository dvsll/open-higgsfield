import { bootStudio } from './boot';
import { EditSurface } from './edit-surface';
await bootStudio(<EditSurface />, () => import('../edit'));
