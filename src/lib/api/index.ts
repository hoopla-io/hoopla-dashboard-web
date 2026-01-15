export { httpClient, API_BASE_URL } from "@/lib/api/http-client";

export { authApi } from "@/lib/api/domains/auth";
export type { LoginRequest, LoginResponse } from "@/lib/api/schemas/auth";

export { partnersApi } from "@/lib/api/domains/partners";
export type { Partner, CreatePartnerRequest, UpdatePartnerRequest, PartnerAttribute, CreatePartnerAttributeRequest } from "@/lib/api/schemas/partners";

export { shopsApi } from "@/lib/api/domains/shops";
export type { Shop, CreateShopRequest, UpdateShopRequest, ShopAttribute, ShopHours, CreateShopHoursRequest, ShopPicture } from "@/lib/api/schemas/shops";

export { drinksApi } from "@/lib/api/domains/drinks";
export type { Drink, CreateDrinkRequest, UpdateDrinkRequest, PartnerDrink, CreatePartnerDrinkRequest, UpdatePartnerDrinkRequest } from "@/lib/api/schemas/drinks";

export { ordersApi } from "@/lib/api/domains/orders";
export type { Order, OrderFilter, ChangeOrderStatusRequest } from "@/lib/api/schemas/orders";

export { usersApi } from "@/lib/api/domains/users";
export type { User, EditUserRequest, FilterUserRequest } from "@/lib/api/schemas/users";
