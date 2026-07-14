import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addConstraint("photos", "status_check", {
          check: "status IN ('pending', 'uploaded', 'upload_failed')"
      });

      pgm.createTable("photos", {
          id: {
              type: "uuid",
              primaryKey: true,
          },
          original_filename: {
              type: "text",
              notNull: true,
          },
          s3_key: {
              type: "text",
              notNull: true,
          },
          content_type: {
              type: "text",
          },
          size_bytes: {
              type: "bigint",
          },
          status: {
              type: "text",
              notNull: true,
              default: "pending",
          },
          created_at: {
              type: "timestamp",
              notNull: true,
              default: pgm.func("now()"),
          },
          updated_at: {
              type: "timestamp",
              notNull: true,
              default: pgm.func("now()"),
          }
      });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("photos");
}
