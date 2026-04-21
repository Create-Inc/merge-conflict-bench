import { getToken } from "@auth/core/jwt";
import { SignJWT } from "jose";
<<<<<<< ours
import { verify, hash } from "argon2";
=======
import { hash, verify } from "argon2";
>>>>>>> theirs
import sql from "@/app/api/utils/sql";

function getSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET);
}

async function signUserToken(user) {
  const secret = getSecret();
  return new SignJWT({
    sub: user.id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email og passord er påkrevd" },
        { status: 400 },
      );
    }

    // Finn bruker med email
    const users = await sql`
      SELECT u.id, u.name, u.email, u.role, a.password
      FROM auth_users u
      JOIN auth_accounts a ON a."userId" = u.id
      WHERE u.email = ${email}
      AND a.provider = 'credentials'
      LIMIT 1
    `;

    if (users.length === 0) {
      return Response.json(
        { error: "Feil brukernavn eller passord" },
        { status: 401 },
      );
    }

    const user = users[0];

    // Verifiser passord
    const isValid = await verify(user.password, password);

    if (!isValid) {
      return Response.json(
        { error: "Feil brukernavn eller passord" },
        { status: 401 },
      );
    }

    const token = await signUserToken(user);

    return Response.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    return Response.json({ error: "Serverfeil" }, { status: 500 });
  }
}

<<<<<<< ours
export async function PUT(request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email og passord er påkrevd" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: "Passordet må være minst 6 tegn" },
        { status: 400 },
      );
    }

    const existing = await sql`
      SELECT id FROM auth_users WHERE email = ${email} LIMIT 1
    `;

    if (existing.length > 0) {
      return Response.json(
        { error: "Bruker finnes allerede" },
        { status: 400 },
      );
    }

    const [createdUser] = await sql`
      INSERT INTO auth_users (name, email, role)
      VALUES (${name || "Ny bruker"}, ${email}, 'customer')
      RETURNING id, name, email, role
    `;

    const hashedPassword = await hash(password);

    await sql`
      INSERT INTO auth_accounts (
        "userId",
        type,
        provider,
        "providerAccountId",
        password
      )
      VALUES (
        ${createdUser.id},
        'credentials',
        'credentials',
        ${createdUser.id},
        ${hashedPassword}
      )
    `;

    const token = await signUserToken(createdUser);

    return Response.json({
      success: true,
      token,
      user: createdUser,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json({ error: "Serverfeil" }, { status: 500 });
  }
}

=======
export async function PUT(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return Response.json(
        { error: "Navn, email og passord er påkrevd" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: "Passordet må være minst 6 tegn" },
        { status: 400 },
      );
    }

    // Sjekk om bruker allerede eksisterer
    const existingUser = await sql`
      SELECT id FROM auth_users WHERE email = ${email} LIMIT 1
    `;

    if (existingUser.length > 0) {
      return Response.json(
        { error: "En bruker med denne e-postadressen eksisterer allerede" },
        { status: 400 },
      );
    }

    // Hash passord
    const hashedPassword = await hash(password);

    // Lag bruker
    const [newUser] = await sql`
      INSERT INTO auth_users (name, email, role)
      VALUES (${name}, ${email}, 'customer')
      RETURNING id, name, email, role
    `;

    // Lag account for credentials
    await sql`
      INSERT INTO auth_accounts ("userId", type, provider, "providerAccountId", password)
      VALUES (${newUser.id}, 'credentials', 'credentials', ${newUser.id}, ${hashedPassword})
    `;

    return Response.json({
      success: true,
      user: newUser,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json(
      { error: "Kunne ikke opprette konto" },
      { status: 500 },
    );
  }
}

>>>>>>> theirs
export async function GET(request) {
  const [token, jwt] = await Promise.all([
    getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.AUTH_URL.startsWith("https"),
      raw: true,
    }),
    getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.AUTH_URL.startsWith("https"),
    }),
  ]);

  if (!jwt) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return new Response(
    JSON.stringify({
      jwt: token,
      user: {
        id: jwt.sub,
        email: jwt.email,
        name: jwt.name,
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
