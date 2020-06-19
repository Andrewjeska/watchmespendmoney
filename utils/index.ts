import util from "util";

export const prettyPrintInfo = (response: any) => {
  console.info(util.inspect(response, { colors: true, depth: 4 }));
};

export const prettyPrintError = (error: Error) => {
  console.error(util.inspect(error, { colors: true, depth: 4 }));
};
