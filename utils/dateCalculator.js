/**
 * Letter Delivery Date Calculator
 * This module answers the fundamental question users face when writing
 * a letter to their future self. Each delivery interval represents a
 * meaningful moment in the user's journey.
 */

// The delivery intervals available to users
const DELIVERY_INTERVALS = {
  IN_A_WEEK: '1week',
  ONE_MONTH: '1month',
  SIX_MONTHS: '6months',
  ONE_YEAR: '1year',
  FIVE_YEARS: '5years',
  CUSTOM_DATE: 'custom'
};

const INTERVAL_LABELS = {
  [DELIVERY_INTERVALS.IN_A_WEEK]: 'In a week',
  [DELIVERY_INTERVALS.ONE_MONTH]: 'One month',
  [DELIVERY_INTERVALS.SIX_MONTHS]: '6 months',
  [DELIVERY_INTERVALS.ONE_YEAR]: '1 year',
  [DELIVERY_INTERVALS.FIVE_YEARS]: '5 years',
  [DELIVERY_INTERVALS.CUSTOM_DATE]: 'Custom date'
};

// The list of valid interval values for schema validation
const VALID_INTERVALS = Object.values(DELIVERY_INTERVALS);

/**
 * Calculates the future delivery date based on the user's chosen interval.
 *
 * The user has finished writing their letter. Now they must
 * decide when their future self should receive it. This function translates
 * their choice into a concrete date.
 */
const calculateFutureDate = (interval, customDate) => {
  const today = new Date();

  const deliveryDateCalculators = {
    // "In a week" - A quick check-in with yourself
    [DELIVERY_INTERVALS.IN_A_WEEK]: () => {
      const deliveryDate = new Date(today);
      deliveryDate.setDate(deliveryDate.getDate() + 7);
      return deliveryDate;
    },

    // "One month" - Time for small changes to take root
    [DELIVERY_INTERVALS.ONE_MONTH]: () => {
      const deliveryDate = new Date(today);
      deliveryDate.setMonth(deliveryDate.getMonth() + 1);
      return deliveryDate;
    },

    // "6 months" - A season of growth and reflection
    [DELIVERY_INTERVALS.SIX_MONTHS]: () => {
      const deliveryDate = new Date(today);
      deliveryDate.setMonth(deliveryDate.getMonth() + 6);
      return deliveryDate;
    },

    // "1 year" - A full cycle of life's rhythms
    [DELIVERY_INTERVALS.ONE_YEAR]: () => {
      const deliveryDate = new Date(today);
      deliveryDate.setFullYear(deliveryDate.getFullYear() + 1);
      return deliveryDate;
    },

    // "5 years" - A letter to a transformed version of yourself
    [DELIVERY_INTERVALS.FIVE_YEARS]: () => {
      const deliveryDate = new Date(today);
      deliveryDate.setFullYear(deliveryDate.getFullYear() + 5);
      return deliveryDate;
    },

    // "Custom date" - A specific moment that matters to you
    [DELIVERY_INTERVALS.CUSTOM_DATE]: () => {
      if (!customDate) {
        throw new Error('Custom date is required when choosing a specific delivery date');
      }
      return new Date(customDate);
    }
  };

  const calculateDeliveryDate = deliveryDateCalculators[interval];

  if (!calculateDeliveryDate) {
    throw new Error(
      `Invalid delivery interval: "${interval}". ` +
      `Valid options are: ${VALID_INTERVALS.join(', ')}`
    );
  }

  return calculateDeliveryDate();
};

module.exports = {
  calculateFutureDate,
  DELIVERY_INTERVALS,
  INTERVAL_LABELS,
  VALID_INTERVALS
};
