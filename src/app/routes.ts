import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Home } from './pages/Home';
import { TokenPage } from './pages/TokenPage';
import { LaunchForge } from './pages/LaunchForge';
import { RaidStudio } from './pages/RaidStudio';
import { QuestArena } from './pages/QuestArena';
import { ProphetLeague } from './pages/ProphetLeague';
import { MirrorFeed } from './pages/MirrorFeed';
import { PassportPage } from './pages/PassportPage';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Landing,
  },
  {
    path: '/dashboard',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'token/:slug', Component: TokenPage },
      { path: 'forge', Component: LaunchForge },
      { path: 'raid-studio', Component: RaidStudio },
      { path: 'quests', Component: QuestArena },
      { path: 'prophets', Component: ProphetLeague },
      { path: 'mirror', Component: MirrorFeed },
      { path: 'passport/:username', Component: PassportPage },
      { path: 'settings', Component: Settings },
    ],
  },
  {
    path: '*',
    Component: NotFound,
  },
]);
