export const saveQueryParamsToLocalStorage = (searchParams) => {
  const params = new URLSearchParams(searchParams);
  const paramsObject = {};
  params.forEach((value, key) => {
    paramsObject[key] = value;
  });

  localStorage.setItem("queryParams", JSON.stringify(paramsObject));
};
export const getLocalStorageValues = () => {
  const savedParams = JSON.parse(localStorage.getItem("queryParams")) || {};
  const {
    agrno = null,
    Email = null,
    ItemId = null,
    Guid = null,
    VersionId = null,
    ViewerToken = null,
    password = null,
    DocumentView = null,
    TokenCode = null,
  } = savedParams;

  return { agrno, Email, password, ItemId, Guid, VersionId, ViewerToken, DocumentView, TokenCode };
};
export const clearLocalStorage = () => {
  localStorage.removeItem("queryParams");
  localStorage.removeItem("openClintInputModal");
}