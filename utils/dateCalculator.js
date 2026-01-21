// Helper function to calculate future delivery dates

const calculateFutureDate = (interval, customDate) => {
  const now = new Date();

  switch (interval) {
    case '1week':
      const oneWeek = new Date(now);
      oneWeek.setDate(oneWeek.getDate() + 7);
      return oneWeek;

    case '2weeks':
      const twoWeeks = new Date(now);
      twoWeeks.setDate(twoWeeks.getDate() + 14);
      return twoWeeks;

    case '1month':
      const oneMonth = new Date(now);
      oneMonth.setMonth(oneMonth.getMonth() + 1);
      return oneMonth;

    case '6months':
      const sixMonths = new Date(now);
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      return sixMonths;

    case '1year':
      const oneYear = new Date(now);
      oneYear.setFullYear(oneYear.getFullYear() + 1);
      return oneYear;

    case '5years':
      const fiveYears = new Date(now);
      fiveYears.setFullYear(fiveYears.getFullYear() + 5);
      return fiveYears;

    case 'custom':
      if (!customDate) {
        throw new Error("Custom date is required");
      }
      return new Date(customDate);

    default:
      throw new Error("Invalid delivery interval selected");
  }
};

module.exports = { calculateFutureDate };
