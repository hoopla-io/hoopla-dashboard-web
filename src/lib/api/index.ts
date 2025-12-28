// HTTP Client
export { httpClient, API_BASE_URL } from "@/lib/api/http-client";

// Auth
export { authApi } from "@/lib/api/domains/auth";
export type { LoginRequest, LoginResponse } from "@/lib/api/schemas/auth";

// Partners
export { partnersApi } from "@/lib/api/domains/partners";
export type { Partner, CreatePartnerRequest, UpdatePartnerRequest, PartnerAttribute, CreatePartnerAttributeRequest } from "@/lib/api/schemas/partners";

// Shops
export { shopsApi } from "@/lib/api/domains/shops";
export type { Shop, CreateShopRequest, UpdateShopRequest, ShopAttribute, ShopHours, CreateShopHoursRequest, ShopPicture } from "@/lib/api/schemas/shops";

// Drinks
export { drinksApi } from "@/lib/api/domains/drinks";
export type { Drink, CreateDrinkRequest, UpdateDrinkRequest, PartnerDrink } from "@/lib/api/schemas/drinks";

// Orders
export { ordersApi } from "@/lib/api/domains/orders";
export type { Order, OrderFilter, ChangeOrderStatusRequest } from "@/lib/api/schemas/orders";

// Users
export { usersApi } from "@/lib/api/domains/users";
export type { User, EditUserRequest, FilterUserRequest } from "@/lib/api/schemas/users";
