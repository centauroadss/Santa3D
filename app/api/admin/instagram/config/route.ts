
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Adjust import path if necessary based on project structure
// import { getUserFromSession } from '@/lib/auth';

export async function GET() {
    try {
        // 1. Auth Check (Optional but recommended)
        // const user = await getUserFromSession();
        // if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 2. Fetch Config
        let config = await prisma.instagramConfig.findFirst();

        // 3. Create Default if not exists
        if (!config) {
            config = await prisma.instagramConfig.create({
                data: {
                    storyHours: "08:00,20:00",
                    feedHours: "12:00",
                    participationMsgs: JSON.stringify([
                        "¡$600 USD AL 1er LUGAR! - ¿Vas a dejar pasar la oportunidad?",
                        "¡GANA $600 USD! - Es tu último chance para participar",
                        "¡PREMIOS EN EFECTIVO! - El primer lugar se lleva $600"
                    ]),
                    votingMsgs: JSON.stringify([
                        "¡Tu voto cuenta! - Apoya a tu talento favorito",
                        "¿Ya elegiste tu favorito? - Vota por el mejor Santa 3D",
                        "¡Ayuda a elegir al ganador! - Dale like a los mejores videos"
                    ]),
                    restrictToOfficialGrid: true,
                    designMode: "auto",
                    timerFormat: "d-h"
                }
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error fetching Instagram config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate fields if necessary

        // Upsert (Update or Create)
        // Since we only want one config row, we update the first one or create.
        const first = await prisma.instagramConfig.findFirst();

        let config;
        if (first) {
            config = await prisma.instagramConfig.update({
                where: { id: first.id },
                data: {
                    storyHours: body.storyHours,
                    feedHours: body.feedHours,
                    participationMsgs: JSON.stringify(body.participationMsgs), // Ensure array is stringified
                    votingMsgs: JSON.stringify(body.votingMsgs),
                    restrictToOfficialGrid: body.restrictToOfficialGrid,
                    designMode: body.designMode,
                    customStoryBg: body.customStoryBg,
                    customFeedBg: body.customFeedBg,
                    timerFormat: body.timerFormat
                }
            });
        } else {
            config = await prisma.instagramConfig.create({
                data: {
                    storyHours: body.storyHours,
                    feedHours: body.feedHours,
                    participationMsgs: JSON.stringify(body.participationMsgs),
                    votingMsgs: JSON.stringify(body.votingMsgs),
                    restrictToOfficialGrid: body.restrictToOfficialGrid,
                    designMode: body.designMode,
                    customStoryBg: body.customStoryBg,
                    customFeedBg: body.customFeedBg,
                    timerFormat: body.timerFormat
                }
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error updating Instagram config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
