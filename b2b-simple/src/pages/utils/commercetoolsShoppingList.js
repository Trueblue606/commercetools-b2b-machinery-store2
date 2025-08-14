import { apiRoot } from './commercetoolsClient';

// Get shopping list by customer
export const getShoppingList = async (customerId) => {
  const res = await apiRoot
    .shoppingLists()
    .get({ queryArgs: { where: `customer(id="${customerId}")` } })
    .execute();
  return res.body.results[0] || null;
};

// Create shopping list if doesn't exist
export const createShoppingListIfNotExists = async (customerId, name) => {
  let list = await getShoppingList(customerId);
  if (!list) {
    const res = await apiRoot.shoppingLists().post({
      body: {
        name: { en: name },
        customer: { typeId: 'customer', id: customerId },
        key: `${customerId}-saved-items`
      }
    }).execute();
    list = res.body;
  }
  return list;
};

// Add product to shopping list
export const addLineItemToShoppingList = async (customerId, productId, variantId) => {
  const list = await createShoppingListIfNotExists(customerId, 'Saved Items');
  await apiRoot.shoppingLists().withId({ ID: list.id }).post({
    body: {
      version: list.version,
      actions: [{
        action: 'addLineItem',
        productId,
        variantId,
        quantity: 1
      }]
    }
  }).execute();
};
