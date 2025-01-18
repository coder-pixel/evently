"use server";

import {
  CreateEventParams,
  DeleteEventParams,
  GetAllEventsParams,
  UpdateEventParams,
} from "@/types";
import { handleError } from "../utils";
import { connectToDatabase } from "../database";
import User from "../database/models/user.model";
import Event from "../database/models/event.model";
import Category from "../database/models/category.model";
import { revalidatePath } from "next/cache";

// helper function
const populateEvent = async (query: any) => {
  return query
    .populate({
      path: "organizer",
      model: User,
      select: "_id firstName lastName",
    })
    .populate({
      path: "category",
      model: Category,
      select: "_id name",
    });
};

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

export const getEventById = async (eventId: string) => {
  try {
    // connect to database
    await connectToDatabase();

    // here event has a property -> organizer with only organizerId, but we instead want to populate it
    // with the organizer data, and same for peoperty -> categoryId (we need category name to display in UI)
    // so that's why we are using populateEvent fn
    const event = await populateEvent(Event.findById(eventId));

    if (!event) {
      throw new Error("Event not found!");
    }

    return JSON.parse(JSON.stringify(event));
  } catch (err) {
    handleError(err);
  }
};

export const getAllEvents = async ({
  query,
  limit = 6,
  page,
  category,
}: GetAllEventsParams) => {
  try {
    await connectToDatabase();

    const conditions = {};

    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: "desc" })
      .skip(0)
      .limit(limit);

    const events = await populateEvent(eventsQuery);
    const eventsCount = await Event.countDocuments(conditions);
    console.log({ eventsCount });

    return {
      data: JSON.parse(JSON.stringify(events)),
      // totalCount: Math.ceil(eventsCount / limit),
      totalCount: eventsCount,
    };
  } catch (error) {
    handleError(error);
  }
};

export const deleteEventById = async ({ eventId, path }: DeleteEventParams) => {
  try {
    // connect to database
    await connectToDatabase();

    const deletedEvent = await Event.findByIdAndDelete(eventId);

    if (deletedEvent) {
      revalidatePath(path);
    }
  } catch (err) {
    handleError(err);
  }
};

// UPDATE
export async function updateEvent({ userId, event, path }: UpdateEventParams) {
  try {
    await connectToDatabase();

    const eventToUpdate = await Event.findById(event._id);
    if (!eventToUpdate || eventToUpdate.organizer.toHexString() !== userId) {
      throw new Error("Unauthorized or event not found");
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      { ...event, category: event.categoryId },
      { new: true }
    );
    revalidatePath(path);

    return JSON.parse(JSON.stringify(updatedEvent));
  } catch (error) {
    handleError(error);
  }
}
