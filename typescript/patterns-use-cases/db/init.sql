create table if not exists users (
       userid varchar(255) not null,
       name varchar(255) not null,
       address varchar(255) not null,
       credits numeric not null,
       version numeric not null,
       primary key (userid)
);

create table if not exists user_idempotency (
       id varchar(255) not null,
       primary key (id)
);

insert into users(userid, name, address, credits, version)
values ('A', 'Don', '1600 Pennsylvania Avenue NW, Washington, DC 20500, USA', 1000, 0),
       ('B', 'Keir', '10 Downing St, London SW1A 2AB, UK', 1000, 0);

