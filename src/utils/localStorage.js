import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
export const saveQueryParamsToLocalStorage = (searchParams) => {
  sessionStorage.setItem("E_V", searchParams);
};
const decryptAES = (encryptedBase64, key) => {
  const decrypted = AES.decrypt(encryptedBase64, key);
  return decrypted.toString(Utf8);
};
export const encryptAES = (text, key) => {
  return AES.encrypt(text, key).toString();
};
export const getLocalStorageValues = () => {
  const savedParams = sessionStorage.getItem("E_V") || {};
  let decryptedValues = decryptAES(savedParams, 'password')
  const params = new URLSearchParams(decryptedValues);
  const paramsObject = {};
  params.forEach((value, key) => {
    paramsObject[key] = value;
  });
  const {
    agrno = null,
    Email = null,
    ItemId = null,
    password = null,
    DocumentView = null,
    TokenCode = null,
  } = paramsObject;
  console.log(paramsObject, 'savedLocalStorageValues')
  return { agrno, Email, password, ItemId, DocumentView, TokenCode };
};
export const clearLocalStorage = () => {
  sessionStorage.removeItem("E_V");
  sessionStorage.removeItem("openClintInputModal");
}