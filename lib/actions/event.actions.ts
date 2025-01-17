"use server";

import { CreateEventParams } from "@/types";
import { handleError } from "../utils";
import { connectToDatabase } from "../database";
import User from "../database/models/user.model";
import Event from "../database/models/event.model";

export const createEvent = async ({
  event,
  userId,
}: //   path,
CreateEventParams) => {
  try {
    // making connnection to DB, need to make connectiion everytime,
    // as it's a serverless action so db connetions are only open when it's necessasry and then shutdown
    await connectToDatabase();

    const organizer = await User.findById(userId); // try to find the event organizer data

    if (!organizer) {
      throw new Error("Organizer not found!");
    }

    const newEvent = await Event.create({
      ...event,
      category: event?.categoryId,
      organizer: userId,
    });

    return JSON.parse(JSON.stringify(newEvent));
  } catch (err) {
    console.log({ err });
    handleError(err);
  }
};
