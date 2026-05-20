import { RemoveFileInfoType } from '@/types';

export function getRmFlagRmList(rmList: string[]): RemoveFileInfoType[] {
  return rmList.map((field) => ({ field, isRemove: true }));
}
