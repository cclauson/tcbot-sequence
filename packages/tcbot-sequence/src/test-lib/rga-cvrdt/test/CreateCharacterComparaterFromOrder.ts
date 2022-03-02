export function createCharacterComparatorFromOrder(order: string): (char1: string, char2: string) => number {
    return (char1: string, char2: string) => {
        return order.indexOf(char1) - order.indexOf(char2);
    }
}
