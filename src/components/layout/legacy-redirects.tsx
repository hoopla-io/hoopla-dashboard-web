import { Navigate, useLocation, useParams } from "react-router-dom";

export function DrinksRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: "/products", search }} replace />;
}

export function DrinkModifiersRedirect() {
  const { id, drinkId } = useParams();
  const { search } = useLocation();
  return <Navigate to={{ pathname: `/partners/${id}/products/${drinkId}/modifiers`, search }} replace />;
}
