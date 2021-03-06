import { DynamoDB } from "aws-sdk";
import validator from "@middy/validator";
import { v4 as uuid } from "uuid";
import commonMiddleware from "../lib/commonMiddleware";
import createAuctionSchema from "../lib/schemas/createAuctionSchema";
import createError from "http-errors";

const dynamo = new DynamoDB.DocumentClient();

async function createAuction(event) {
  /*
  Creates an auction and stores it in DynamoDB
   */

  const { title } = event.body;
  const { email } = event.requestContext.authorizer;
  const now = new Date();
  const endDate = new Date();
  endDate.setHours(now.getHours() + 1); // to set the end of the auction to 1 hour after creation

  const auction = {
    id: uuid(), // generates a random id for the auction
    title,
    status: "OPEN",
    createdAt: now.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0,
    },
    seller: email,
  };

  try {
    await dynamo
      .put({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Item: auction,
      })
      .promise();
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201, // resource created
    body: JSON.stringify(auction),
  };
}

export const handler = commonMiddleware(createAuction).use(
  validator({ inputSchema: createAuctionSchema })
);
