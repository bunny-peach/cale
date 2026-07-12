// Preset virtual gift shop. Icons are lucide-react component names (resolved in
// the UI) so we stay emoji-free.
export interface Gift {
  name: string; // display name, also used in [GIFT_SEND: name]
  icon: string; // lucide icon key
  price: number;
}

export const GIFTS: Gift[] = [
  { name: "玫瑰", icon: "Flower2", price: 20 },
  { name: "奶茶", icon: "CupSoda", price: 15 },
  { name: "桃子", icon: "Cherry", price: 10 },
  { name: "兔子玩偶", icon: "Rabbit", price: 66 },
  { name: "亲亲券", icon: "Heart", price: 5 },
  { name: "蛋糕", icon: "Cake", price: 30 },
  { name: "星星", icon: "Star", price: 8 },
  { name: "皇冠", icon: "Crown", price: 99 },
];

export function findGift(name: string): Gift | undefined {
  const clean = name.trim();
  return GIFTS.find((g) => g.name === clean);
}
