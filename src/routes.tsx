import { Navigate, type RouteObject } from 'react-router';
import { DEFAULT_USERNAME } from './config';
import { ProfileLayout } from './components/layout/ProfileLayout';
import { OverviewPage } from './pages/OverviewPage';
import { RepositoriesPage } from './pages/RepositoriesPage';
import { RouteErrorPage } from './pages/RouteErrorPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { PackagesPage } from './pages/PackagesPage';
import { StarsPage } from './pages/StarsPage';

/**
 * One layout route per profile; each tab is a child route so the URL is the source of truth
 * for the active tab (deep links, back/forward and reloads all work). A pathless root route catches
 * anything no section handled, so visitors never see React Router's developer error page.
 */
export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', element: <Navigate to={`/${DEFAULT_USERNAME}`} replace /> },
      {
        path: '/:username',
        element: <ProfileLayout />,
        children: [
          { index: true, element: <OverviewPage /> },
          { path: 'repositories', element: <RepositoriesPage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'packages', element: <PackagesPage /> },
          { path: 'stars', element: <StarsPage /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];
