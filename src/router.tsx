import { createBrowserRouter } from "react-router-dom";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import DashboardPage from "@/app/(dashboard)/page";
import PartnersPage from "@/app/(dashboard)/partners/page";
import PartnerOnboardingPage from "@/app/(dashboard)/partners/onboarding/page";
import PartnerDetailPage from "@/app/(dashboard)/partners/[id]/page";
import PartnerDrinkModifiersPage from "@/app/(dashboard)/partners/[id]/drinks/[drinkId]/modifiers/page";
import ShopsPage from "@/app/(dashboard)/shops/page";
import ShopDetailPage from "@/app/(dashboard)/shops/[id]/page";
import DrinksPage from "@/app/(dashboard)/drinks/page";
import CategoriesPage from "@/app/(dashboard)/categories/page";
import OrdersPage from "@/app/(dashboard)/orders/page";
import UsersPage from "@/app/(dashboard)/users/page";
import StoriesPage from "@/app/(dashboard)/stories/page";
import StoryDetailPage from "@/app/(dashboard)/stories/[id]/page";
import BannersPage from "@/app/(dashboard)/banners/page";
import PromocodesPage from "@/app/(dashboard)/promocodes/page";
import GiftCardsPage from "@/app/(dashboard)/gift-cards/page";
import NotificationsPage from "@/app/(dashboard)/notifications/page";
import NotificationDetailPage from "@/app/(dashboard)/notifications/[id]/page";
import ShopCategoriesPage from "@/app/(dashboard)/shop-categories/page";
import SettlementsPage from "@/app/(dashboard)/settlements/page";
import AppReleasesPage from "@/app/(dashboard)/app-releases/page";
import SettingsPage from "@/app/(dashboard)/settings/page";
import LoginPage from "@/app/login/page";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "partners", element: <PartnersPage /> },
      { path: "partners/onboarding", element: <PartnerOnboardingPage /> },
      { path: "partners/:id", element: <PartnerDetailPage /> },
      {
        path: "partners/:id/products/:drinkId/modifiers",
        element: <PartnerDrinkModifiersPage />,
      },
      {
        path: "partners/:id/drinks/:drinkId/modifiers",
        element: <PartnerDrinkModifiersPage />,
      },
      { path: "shops", element: <ShopsPage /> },
      { path: "shops/:id", element: <ShopDetailPage /> },
      { path: "products", element: <DrinksPage /> },
      { path: "drinks", element: <DrinksPage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "stories", element: <StoriesPage /> },
      { path: "stories/:id", element: <StoryDetailPage /> },
      { path: "banners", element: <BannersPage /> },
      { path: "promocodes", element: <PromocodesPage /> },
      { path: "gift-cards", element: <GiftCardsPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "notifications/:id", element: <NotificationDetailPage /> },
      { path: "shop-categories", element: <ShopCategoriesPage /> },
      { path: "settlements", element: <SettlementsPage /> },
      { path: "app-releases", element: <AppReleasesPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
