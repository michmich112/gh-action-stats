# GitHub Action Stats - Function

Backend for the GitHub action stats platform

## Configuration

### Environment Variables

| Variable | Required | Description |
| `PG_URI` | `True` | Postgres Connection Uri: `postgresql://<username>:<password>@<host>:<port>/<database>` |
| `SUPABASE_URL` | `True` | Url to the Supabase instance (c.f. Supabase docs) |
| `SUPABASE_KEY` | `True` | Anon Private Key for the Supabase instance |

### Postgres Configurations

The Postgres user must have the following permissions on the selected database:

- `CREATE`
- `ALTER`
- `INSERT`
- `SELECT`
- `UPDATE`

### Supabase Configurations

The Supabase key must have the permissions to upload, and download files on the `badges` bucket.
