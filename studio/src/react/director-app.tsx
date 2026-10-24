import { bootStudio } from './boot';
import { DirectorSurface } from './director-surface';
await bootStudio(<DirectorSurface />, () => import('../director'));
