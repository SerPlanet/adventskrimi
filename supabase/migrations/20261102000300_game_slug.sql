-- D40: one deployment, several games. The link /#/<slug> chooses the game.
alter table games add column slug text;
update games set slug = 'spiel-' || substr(id::text, 1, 8) where slug is null;
alter table games alter column slug set not null;
alter table games add constraint games_slug_format check (slug ~ '^[a-z0-9-]{2,40}$');
create unique index games_slug_key on games (slug);
