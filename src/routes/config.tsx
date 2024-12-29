import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';

// Lazy load pages
const Index = lazy(() => import('@/pages/Index'));
const Auth = lazy(() => import('@/pages/Auth'));
const Patients = lazy(() => import('@/pages/Patients'));
const TemplateManager = lazy(() => import('@/pages/TemplateManager'));

export const routes: RouteObject[] = [
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <Index />,
      },
      {
        path: '/c/:sessionId',
        element: <Index />,
      },
      {
        path: '/patients',
        element: <Patients />,
      },
      {
        path: '/templates',
        element: <TemplateManager />,
      },
    ],
  },
];