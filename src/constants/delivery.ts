/** Населенные пункты/районы доставки (без отдельной таблицы; при необходимости вынесите в API). */
export interface DeliverySettlement {
  id: string;
  name: string;
  price: number;
  min_order_amount: number;
}

export const DELIVERY_SETTLEMENTS: DeliverySettlement[] = [
  { id: 'center', name: 'Центр города', price: 199, min_order_amount: 0 },
  { id: 'district', name: 'Спальный район', price: 299, min_order_amount: 0 },
  { id: 'outskirts', name: 'Пригород', price: 399, min_order_amount: 1500 },
];
