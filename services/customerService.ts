/**
 * Customer Service
 *
 * Handles customer management and customer-related operations.
 */

import { and, asc, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { platformCustomers } from "@/db/schema";

/**
 * Get a customer by ID
 */
export async function getCustomerById(customerId: number) {
  const customer = await db.query.platformCustomers.findFirst({
    where: eq(platformCustomers.id, customerId),
  });

  return customer;
}

/**
 * Get customers for a mailbox
 */
export async function getCustomersForMailbox(
  mailboxId: number,
  options: {
    limit?: number;
    offset?: number;
    sortBy?: "name" | "email" | "createdAt";
    sortDirection?: "asc" | "desc";
    searchTerm?: string;
  } = {}
) {
  const { limit = 50, offset = 0, sortBy = "createdAt", sortDirection = "desc", searchTerm } = options;

  const conditions: (SQL | undefined)[] = [eq(platformCustomers.mailboxId, mailboxId)];

  if (searchTerm) {
    conditions.push(
      or(ilike(platformCustomers.name, `%${searchTerm}%`), ilike(platformCustomers.email, `%${searchTerm}%`))
    );
  }

  let query = db
    .select()
    .from(platformCustomers)
    .where(and(...conditions))
    .limit(limit)
    .offset(offset);

  // Add sorting
  const sortColumn =
    sortBy === "name"
      ? platformCustomers.name
      : sortBy === "email"
        ? platformCustomers.email
        : platformCustomers.createdAt;

  const sortFunction = sortDirection === "asc" ? asc : desc;

  const customers = await query.orderBy(sortFunction(sortColumn));

  return customers;
}

/**
 * Create a new customer
 */
export async function createCustomer(
  mailboxId: number,
  customerData: {
    name: string;
    email: string;
  }
) {
  const newCustomer = await db
    .insert(platformCustomers)
    .values({
      mailboxId,
      name: customerData.name,
      email: customerData.email,
      createdAt: new Date(),
      updatedAt: new Date(),
      value: null, // Assuming this is a nullable field
      links: null, // Assuming this is a nullable field
    })
    .returning();

  return newCustomer[0];
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
  customerId: number,
  mailboxId: number,
  updates: {
    name?: string;
    email?: string;
    metadata?: Record<string, any>;
  }
) {
  // Get the existing customer to merge metadata
  const existingCustomer = await getCustomerById(customerId);

  if (!existingCustomer || existingCustomer.mailboxId !== mailboxId) {
    return null;
  }

  // Prepare the update data
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (updates.name) {
    updateData.name = updates.name;
  }

  if (updates.email) {
    updateData.email = updates.email;
  }

  // Note: metadata field removed from schema, handling custom attributes differently
  // if (updates.metadata) {
  //   updateData.metadata = {
  //     ...existingCustomer.metadata,
  //     ...updates.metadata,
  //   };
  // }

  // Perform the update
  const updatedCustomer = await db
    .update(platformCustomers)
    .set(updateData)
    .where(and(eq(platformCustomers.id, customerId), eq(platformCustomers.mailboxId, mailboxId)))
    .returning();

  return updatedCustomer[0];
}

/**
 * Delete a customer
 */
export async function deleteCustomer(customerId: number, mailboxId: number) {
  const result = await db
    .delete(platformCustomers)
    .where(and(eq(platformCustomers.id, customerId), eq(platformCustomers.mailboxId, mailboxId)))
    .returning();

  return result[0];
}

export default {
  getCustomerById,
  getCustomersForMailbox,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
