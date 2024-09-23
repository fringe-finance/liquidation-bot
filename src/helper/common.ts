import { ethers } from 'ethers';

export function stringToArray(stringArray: string | undefined, sign: string) {
    if (!stringArray) return [];
    let array = stringArray.split(sign);
    array = array.map((item) => item.trim());
    return array;
}

export function uint256ToNumber(a: bigint, decimals: number) {
    return Number(ethers.formatUnits(a, decimals));
}
