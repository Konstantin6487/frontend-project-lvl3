const corsProxyUrl = 'https://cors-anywhere.herokuapp.com';

export const buildUrl = (url) => `${corsProxyUrl}/${url}`;

export const validate = (value, constraints) => {
  const checkedForInvalid = constraints.find(({ check }) => check(value));
  if (checkedForInvalid) {
    return ({ isValid: false, message: checkedForInvalid.message });
  }
  return ({ isValid: true });
};
