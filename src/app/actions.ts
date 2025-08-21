
'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { Player, Opponent, Match, Training, Channel, Message, PushSubscription, UserProfileUpdate } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import webpush from 'web-push';

// VAPID keys should be configured only if they are set in environment variables
if (process.env.VAPID_SUBJECT && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT,
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
    } catch(e) {
        console.error("Failed to set VAPID details. Make sure the keys are correct.", e);
    }
}


// Auth Actions
export async function signUp(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name, // You can add custom data to the user
      },
    },
  });

  if (authError) {
    return { success: false, error: { message: "Impossible de créer le compte : " + authError.message } };
  }
  
  if (!authData.user) {
     return { success: false, error: { message: "L'utilisateur n'a pas été créé, veuillez réessayer." } };
  }

  // Create player profile linked to the new auth user
  const playerData: Omit<Player, 'id' | 'goals' | 'fouls' | 'points' | 'presence_status' | 'last_seen'> = {
      user_id: authData.user.id,
      name: name,
      email: email,
      team: 'D1', // Default value
      position: '',
      preferred_foot: '',
      avatar_url: '',
  };

  const { error: playerError } = await supabase
    .from('players')
    .insert(playerData);

  if (playerError) {
    console.error("Failed to create player profile after signup:", playerError);
    // If player creation fails, you might want to delete the auth user to avoid orphans
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: { message: "Impossible de créer le profil joueur : " + playerError.message } };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}


export async function signInWithPassword(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: { message: error.message } };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
}


// Match related actions

export async function getMatches(): Promise<Match[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Failed to fetch matches:", error);
    return [];
  }
  return data as Match[];
}


export async function deleteMatch(matchId: string): Promise<{ success: boolean, error?: any }> {
    const supabase = createClient();
    
    const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

    if (error) {
        console.error("Failed to delete match:", error);
        return { success: false, error };
    }

    revalidatePath('/matches');

    return { success: true };
}


// Player related actions

export async function getPlayers(): Promise<Player[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('points', { ascending: false, nullsFirst: true })
    .order('name', { ascending: true });
    
  if (error) {
    console.error("Failed to fetch players:", error);
    return [];
  }
  
  return data as Player[];
}


export async function getPlayerById(playerId: string): Promise<Player | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();
      
    if (error) {
        console.error(`Failed to fetch player ${playerId}:`, error);
        return null;
    }
    return data;
}

export async function getCurrentPlayer(): Promise<Player | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single();
    
    if (error) {
        console.error("Failed to fetch current player profile:", error);
        return null;
    }

    return data;
}


export async function createPlayer(formData: FormData) {
  const supabaseAdmin = createAdminClient();
  
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
      return { error: { message: "Le nom, l'email et le mot de passe sont obligatoires." }};
  }
  
  // 1. Create Auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Auto-confirm email
  });

  if (authError) {
    console.error("Failed to create auth user:", authError);
    return { error: { message: "Impossible de créer le compte utilisateur : " + authError.message } };
  }
  const authUserId = authData.user.id;
  
  // 2. Create player profile linked to the new auth user
  const playerData: Omit<Player, 'id' | 'goals' | 'fouls' | 'points' | 'presence_status' | 'last_seen'> = {
      user_id: authUserId,
      name: name,
      email: email,
      team: 'D1', // Default value
      position: '',
      preferred_foot: '',
      avatar_url: '',
  };

  const supabase = createClient();
  const { error: playerError } = await supabase
    .from('players')
    .insert(playerData);

  if (playerError) {
    console.error("Failed to create player profile:", playerError);
    // If player creation fails, delete the auth user to avoid orphans
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
    return { error: { message: "Impossible de créer le profil joueur : " + playerError.message } };
  }

  revalidatePath('/admin/players');
  redirect('/admin/players');
}


export async function updatePlayer(formData: FormData) {
  const supabase = createClient();
  const supabaseAdmin = createAdminClient();
  
  const playerId = formData.get('id') as string;
  const newEmail = formData.get('email') as string;
  const newPassword = formData.get('password') as string;

  if (!playerId) {
    return { error: { message: "Player ID is missing for update." }};
  }
  
  const { data: existingPlayer, error: fetchError } = await supabase
    .from('players')
    .select('user_id, email')
    .eq('id', playerId)
    .single();

  if (fetchError) {
    return { error: { message: "Could not find existing player." }};
  }

  let authUserId = existingPlayer.user_id;

  // --- Auth Management ---
  // Scenario 1: Player already has an auth account. Update it if needed.
  if (authUserId) {
    const authUpdates: any = {};
    if (newEmail && newEmail !== (existingPlayer.email || '')) {
      authUpdates.email = newEmail;
    }
    if (newPassword) {
      authUpdates.password = newPassword;
    }
    if (Object.keys(authUpdates).length > 0) {
      const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, authUpdates);
      if (updateUserError) {
        return { error: { message: "Failed to update auth user: " + updateUserError.message }};
      }
    }
  } 
  // Scenario 2: Player exists but has no auth account. Create one if email/password are provided.
  else if (!authUserId && newEmail && newPassword) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: newEmail,
          password: newPassword,
          email_confirm: true,
      });

      if (authError) {
          return { error: { message: "Failed to create new auth user for existing player: " + authError.message }};
      }
      authUserId = authData.user.id; // Get the newly created user ID
  }
  
  // --- Player Profile Update ---
  const playerData: Partial<Player> = {
      name: formData.get('name') as string,
      email: newEmail || null,
      user_id: authUserId, // Update user_id in case it was just created
      team: formData.get('team') as 'D1' | 'D2' | 'Autre',
      position: formData.get('position') === 'unspecified' ? '' : formData.get('position') as Player['position'],
      preferred_foot: formData.get('preferred_foot') === 'unspecified' ? '' : formData.get('preferred_foot') as Player['preferred_foot'],
      avatar_url: formData.get('avatar_url') as string,
  };

  const { error } = await supabase
    .from('players')
    .update(playerData)
    .eq('id', playerId);

  if (error) {
     console.error(`Failed to update player ${playerId}:`, error);
    return { error: { message: error.message } };
  }

  revalidatePath('/admin/players');
  revalidatePath(`/player/${playerId}`);
  redirect('/admin/players');
}


export async function deletePlayer(playerId: string) {
    const supabase = createClient();
    const supabaseAdmin = createAdminClient();
    
    // First, find the player to get their user_id
    const { data: player, error: fetchError } = await supabase
        .from('players')
        .select('user_id')
        .eq('id', playerId)
        .single();

    if (fetchError) {
        console.error(`Failed to find player ${playerId} for deletion:`, fetchError);
        return { error: "Joueur non trouvé." };
    }

    // If an associated auth user exists, delete it.
    if (player.user_id) {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(player.user_id);
        if (authError) {
            console.error(`Failed to delete auth user ${player.user_id}:`, authError);
            // Non-fatal, we can still try to delete the player profile
        }
    }
    
    // Then, delete the player profile. This will cascade and delete related entries.
    const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

    if (error) {
        console.error(`Failed to delete player ${playerId}:`, error);
        return { error: error.message };
    }

    revalidatePath('/admin/players');
    revalidatePath('/');
}


export async function updatePlayerStats({ playerId, goals, fouls }: { playerId: string, goals?: number, fouls?: number }): Promise<{ success: boolean }> {
    const supabase = createClient();
    
    // Using a transaction to ensure both reads and writes are consistent
    const { data: currentPlayer, error: fetchError } = await supabase
      .from('players')
      .select('goals, fouls, points')
      .eq('id', playerId)
      .single();
    
    if (fetchError) {
      console.error(`Could not fetch player ${playerId} for stats update`, fetchError);
      return { success: false };
    }

    const newGoals = (currentPlayer.goals || 0) + (goals || 0);
    const newFouls = (currentPlayer.fouls || 0) + (fouls || 0);
    
    // Points are added separately now, this just updates stats
    const { error: updateError } = await supabase
      .from('players')
      .update({
        goals: newGoals,
        fouls: newFouls,
      })
      .eq('id', playerId);

    if (updateError) {
      console.error(`Failed to update stats for player ${playerId}`, updateError);
      return { success: false };
    }

    // If a goal was scored, add points using the RPC function
    if (goals && goals > 0) {
        const pointsPerGoal = 5;
        await incrementPlayerPoints(playerId, goals * pointsPerGoal);
    }
    
    revalidatePath(`/player/${playerId}`);
    revalidatePath('/admin/players');
    revalidatePath(`/match/*`);

    return { success: true };
}

export async function incrementPlayerPoints(playerId: string, points: number): Promise<{ success: boolean }> {
    const supabase = createClient();
    
    const { error } = await supabase.rpc('increment_player_points', {
      player_id_arg: playerId,
      points_to_add: points
    });

    if (error) {
        console.error(`Failed to increment points for player ${playerId}:`, error);
        return { success: false };
    }

    revalidatePath(`/player/${playerId}`);
    revalidatePath('/admin/players');
    revalidatePath(`/match/*`);
    revalidatePath('/trainings');
    
    return { success: true };
}

export async function resetAllPlayersStats(): Promise<{ success: boolean; error?: any }> {
    const supabase = createClient();
    const { error } = await supabase
        .from('players')
        .update({
            points: 0,
            goals: 0,
            fouls: 0
        })
        .not('id', 'is', null); // Condition to update all rows

    if (error) {
        console.error("Failed to reset all player stats:", error);
        return { success: false, error };
    }

    revalidatePath('/admin/players');
    revalidatePath('/player');

    return { success: true };
}


const POINTS_FOR_JERSEY_WASHING = 25;

export async function updateJerseyWasher({
  matchId,
  newWasherPlayerId,
  previousWasherPlayerId
}: {
  matchId: string,
  newWasherPlayerId: string | null,
  previousWasherPlayerId?: string | null,
}): Promise<{ success: boolean, message?: string, error?: string }> {
  const supabase = createClient();

  const { data: match, error: fetchError } = await supabase
    .from('matches')
    .select('details')
    .eq('id', matchId)
    .single();

  if (fetchError) {
      console.error("Failed to fetch match for jersey washer update:", fetchError);
      return { success: false, error: "Impossible de récupérer les détails du match." };
  }

  const updatedDetails = {
    ...match.details,
    jerseyWasherPlayerId: newWasherPlayerId,
  };
  
  const { error: matchUpdateError } = await supabase
    .from('matches')
    .update({ details: updatedDetails })
    .eq('id', matchId);

  if (matchUpdateError) {
    console.error("Failed to update jersey washer in match:", matchUpdateError);
    return { success: false, error: "Impossible de mettre à jour le match." };
  }
  
  if (newWasherPlayerId !== previousWasherPlayerId) {
    if (previousWasherPlayerId) {
      await incrementPlayerPoints(previousWasherPlayerId, -POINTS_FOR_JERSEY_WASHING);
    }
    if (newWasherPlayerId) {
      const { success } = await incrementPlayerPoints(newWasherPlayerId, POINTS_FOR_JERSEY_WASHING);
      if(!success) {
          console.error(`Failed to grant points to ${newWasherPlayerId}`);
          return { success: false, error: "Le match a été mis à jour, mais l'attribution des points a échoué." };
      }
    }
  }

  revalidatePath(`/match/${matchId}`);
  revalidatePath('/admin/players');
  if(newWasherPlayerId) revalidatePath(`/player/${newWasherPlayerId}`);
  if(previousWasherPlayerId) revalidatePath(`/player/${previousWasherPlayerId}`);

  const newPlayer = newWasherPlayerId ? await getPlayerById(newWasherPlayerId) : null;
  const message = newWasherPlayerId ? `${newPlayer?.name} est maintenant responsable des maillots et a reçu ${POINTS_FOR_JERSEY_WASHING} points.` : "Le responsable des maillots a été retiré.";

  return { success: true, message: message };
}

export type PlayerActivity = {
    jerseyWashingCount: number;
    availabilityCount: number;
    trainingAttendanceCount: number;
};

export async function getPlayerActivity(playerId: string): Promise<PlayerActivity> {
    const supabase = createClient();
    const { data: matches, error: matchesError } = await supabase.from('matches').select('details');
    const { data: trainings, error: trainingsError } = await supabase.from('trainings').select('poll');

    if (matchesError || trainingsError) {
        console.error("Failed to fetch data for player activity:", matchesError || trainingsError);
        return { jerseyWashingCount: 0, availabilityCount: 0, trainingAttendanceCount: 0 };
    }

    let jerseyWashingCount = 0;
    let availabilityCount = 0;
    let trainingAttendanceCount = 0;

    for (const match of matches as Match[]) {
        if (match.details?.jerseyWasherPlayerId === playerId) {
            jerseyWashingCount++;
        }
        if (match.details?.poll?.availabilities.some(a => a.playerId === playerId && a.status === 'available')) {
            availabilityCount++;
        }
    }

    for (const training of trainings as Training[]) {
        if (training.poll?.availabilities.some(a => a.playerId === playerId && a.status === 'available')) {
            trainingAttendanceCount++;
        }
    }

    return { jerseyWashingCount, availabilityCount, trainingAttendanceCount };
}


// Opponent related actions

export async function getOpponents(): Promise<Opponent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('opponents')
    .select('*')
    .order('team_name', { ascending: true });
    
  if (error) {
    console.error("Failed to fetch opponents:", error);
    return [];
  }
  return data as Opponent[];
}

export async function getOpponentById(opponentId: string): Promise<Opponent | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('opponents')
      .select('*')
      .eq('id', opponentId)
      .single();
      
    if (error) {
        console.error(`Failed to fetch opponent ${opponentId}:`, error);
        return null;
    }
    return data;
}

export async function createOpponent(formData: FormData) {
  const supabase = createClient();

  const opponentData = {
      team_name: formData.get('team_name'),
      club_name: formData.get('club_name'),
      logo_url: formData.get('logo_url'),
      championship: formData.get('championship'),
      coach_name: formData.get('coach_name'),
      coach_email: formData.get('coach_email'),
      coach_phone: formData.get('coach_phone'),
      address: formData.get('address'),
  };

  const { error } = await supabase
    .from('opponents')
    .insert([opponentData]);

  if (error) {
    console.error("Failed to create opponent:", error);
    return { error: error.message };
  }

  revalidatePath('/admin/opponents');
  redirect('/admin/opponents');
}


export async function updateOpponent(formData: FormData) {
  const supabase = createClient();
  const opponentId = formData.get('id');

  if (!opponentId) {
    return { error: "Opponent ID is missing for update." };
  }

  const opponentData = {
      team_name: formData.get('team_name'),
      club_name: formData.get('club_name'),
      logo_url: formData.get('logo_url'),
      championship: formData.get('championship'),
      coach_name: formData.get('coach_name'),
      coach_email: formData.get('coach_email'),
      coach_phone: formData.get('coach_phone'),
      address: formData.get('address'),
  };

  const { error } = await supabase
    .from('opponents')
    .update(opponentData)
    .eq('id', opponentId);

  if (error) {
     console.error(`Failed to update opponent ${opponentId}:`, error);
    return { error: error.message };
  }

  revalidatePath('/admin/opponents');
  revalidatePath(`/opponent/${opponentId}`);
  redirect('/admin/opponents');
}


export async function deleteOpponent(opponentId: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from('opponents')
        .delete()
        .eq('id', opponentId);

    if (error) {
        console.error(`Failed to delete opponent ${opponentId}:`, error);
        return { error: error.message };
    }

    revalidatePath('/admin/opponents');
}


// Training related actions
export async function createTraining(formData: FormData) {
  const supabase = createClient();
  
  const trainingData = {
      title: formData.get('title'),
      date: formData.get('date'),
      time: formData.get('time'),
      location: formData.get('location'),
      description: formData.get('description'),
      poll: { status: 'inactive', availabilities: [], deadline: null }
  };

  const { error } = await supabase
    .from('trainings')
    .insert([trainingData]);

  if (error) {
    console.error("Failed to create training:", error);
    return { error: { form: error.message } };
  }

  revalidatePath('/trainings');
  redirect('/trainings');
}

export async function getTrainings(): Promise<Training[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .order('date', { ascending: false })
    .order('time', { ascending: false });

  if (error) {
    console.error("Failed to fetch trainings:", error);
    return [];
  }
  return data as Training[];
}

export async function updateTrainingPoll(trainingId: string, poll: Training['poll']) {
  const supabase = createClient();
  const { error } = await supabase
    .from('trainings')
    .update({ poll })
    .eq('id', trainingId);

  if (error) {
    console.error(`Failed to update poll for training ${trainingId}:`, error);
    return { success: false, error: error.message };
  }

  revalidatePath('/trainings');
  return { success: true };
}


export async function deleteTraining(trainingId: string): Promise<{ success: boolean; error?: any }> {
  const supabase = createClient();
  const { error } = await supabase.from('trainings').delete().eq('id', trainingId);

  if (error) {
    console.error(`Failed to delete training ${trainingId}:`, error);
    return { success: false, error };
  }

  revalidatePath('/trainings');
  return { success: true };
}


// Chat Actions
export async function getChannels(): Promise<Channel[]> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase.rpc('get_user_channels');

    if (error) {
        console.error('Failed to fetch channels via RPC:', error);
        return [];
    }

    return (data as any[] || []) as Channel[];
}


export async function createOrGetPrivateChannel(recipientId: string): Promise<{ channelId: string | null, error?: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Utilisateur non authentifié.', channelId: null };
    }
    
    // Find the recipient's auth user_id from their player id
    const { data: recipientPlayer, error: playerError } = await supabase.from('players').select('user_id').eq('id', recipientId).single();
    if (playerError || !recipientPlayer?.user_id) {
        return { error: "Ce joueur n'a pas de compte de connexion.", channelId: null };
    }
    const recipientUserId = recipientPlayer.user_id;

    if (user.id === recipientUserId) {
        return { error: 'Vous ne pouvez pas démarrer une conversation avec vous-même.', channelId: null };
    }

    // Check if a private channel already exists between the two users
    const { data: existingChannel, error: rpcError } = await supabase.rpc('find_private_channel', {
      user_1_id: user.id,
      user_2_id: recipientUserId
    });
    
    if (rpcError) {
        console.error("RPC Error finding private channel", rpcError);
        return { error: "Erreur lors de la recherche du canal.", channelId: null };
    }
    
    if (existingChannel) {
        return { channelId: existingChannel };
    }

    // If not, create a new private channel
    const { data: newChannel, error: createChannelError } = await supabase
        .from('channels')
        .insert({
            type: 'private',
            created_by: user.id,
        })
        .select()
        .single();
    
    if (createChannelError) {
        console.error('Failed to create private channel:', createChannelError);
        return { error: "Impossible de créer la conversation.", channelId: null };
    }

    // Add both users as participants
    const { error: participantsError } = await supabase
        .from('channel_participants')
        .insert([
            { channel_id: newChannel.id, user_id: user.id },
            { channel_id: newChannel.id, user_id: recipientUserId },
        ]);
        
    if (participantsError) {
        console.error('Failed to add participants to private channel:', participantsError);
        // Clean up created channel if participants fail
        await supabase.from('channels').delete().eq('id', newChannel.id);
        return { error: "Impossible d'ajouter les participants.", channelId: null };
    }

    revalidatePath('/chat');
    return { channelId: newChannel.id };
}

export async function getMessages(channelId: string): Promise<Message[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('messages')
        .select(`
            *,
            sender:players(id, name, avatar_url, user_id)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error(`Failed to fetch messages for channel ${channelId}:`, error);
        return [];
    }

    // The result from Supabase might be complex. We need to associate the correct player with each message.
    // The relationship is message.user_id -> player.user_id
    const { data: players, error: playersError } = await supabase.from('players').select('id, name, avatar_url, user_id');
    if (playersError) {
        console.error("Failed to fetch players for message sender mapping:", playersError);
        return (data as Message[]).map(m => ({ ...m, sender: undefined })); // Return messages without sender info
    }

    return (data as any[]).map((message: Message) => ({
        ...message,
        sender: players.find(p => p.user_id === message.user_id)
    }));
}


export async function sendMessage(channelId: string, content: string): Promise<{ success: boolean, error?: any }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: { message: "Utilisateur non authentifié." } };
    }

    const { error } = await supabase
        .from('messages')
        .insert({
            content,
            channel_id: channelId,
            user_id: user.id
        });

    if (error) {
        console.error('Failed to send message:', error);
        return { success: false, error };
    }

    // No need to revalidate path here, client will get update via realtime
    return { success: true };
}


// Push Notification Actions

export async function savePushSubscription(subscription: PushSubscription): Promise<{ success: boolean, error?: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Utilisateur non authentifié." };
    }

    const { error } = await supabase
        .from('push_subscriptions')
        .insert({
            user_id: user.id,
            endpoint: subscription.endpoint,
            keys: subscription.keys,
        });

    if (error) {
        // Handle potential duplicate endpoint error gracefully
        if (error.code === '23505') { // Unique constraint violation
            console.log(`Subscription with endpoint ${subscription.endpoint} already exists.`);
            return { success: true };
        }
        console.error("Failed to save push subscription:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}


export async function deletePushSubscription(endpoint: string): Promise<{ success: boolean, error?: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        // Can be called on logout, so no user is expected.
        // The RLS policy will prevent unauthorized deletion.
        return { success: true };
    }

    const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);

    if (error) {
        console.error("Failed to delete push subscription:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}


interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    data?: {
        url?: string;
    }
}

export async function sendPushNotification(userId: string, payload: NotificationPayload): Promise<{ success: boolean, error?: any }> {
    if (!process.env.VAPID_SUBJECT || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.error("VAPID keys are not configured. Cannot send push notifications.");
        return { success: false, error: "VAPID keys not configured." };
    }

    // This action must use the service role key to bypass RLS and read subscriptions.
    const supabase = createAdminClient();
    
    const { data: subscriptions, error: fetchError } = await supabase
        .from('push_subscriptions')
        .select('endpoint, keys')
        .eq('user_id', userId);

    if (fetchError) {
        console.error("Failed to fetch push subscriptions for user:", userId, fetchError);
        return { success: false, error: fetchError };
    }

    if (!subscriptions || subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}.`);
        return { success: true }; // Not an error
    }

    const notificationPromises = subscriptions.map(s => {
        const sub: webpush.PushSubscription = {
            endpoint: s.endpoint,
            keys: s.keys as { p256dh: string; auth: string; },
        };
        
        return webpush.sendNotification(sub, JSON.stringify(payload)).catch(err => {
            console.error(`Failed to send notification to ${s.endpoint}. Status: ${err.statusCode}. Body: ${err.body}`);
            // If subscription is expired or invalid, we should remove it from the DB.
            if (err.statusCode === 404 || err.statusCode === 410) {
                console.log(`Subscription expired or invalid. Deleting...`);
                // Fire-and-forget deletion
                deletePushSubscription(s.endpoint);
            }
        });
    });

    await Promise.all(notificationPromises);

    return { success: true };
}


export async function sendNotificationToAllPlayers(payload: NotificationPayload) {
    const supabase = createAdminClient();

    // 1. Get all player user_ids that are not null
    const { data: players, error: playersError } = await supabase
        .from('players')
        .select('user_id')
        .not('user_id', 'is', null);

    if (playersError) {
        console.error('Could not get players for broadcast notification:', playersError);
        return;
    }

    // 2. Send notification to each player
    for (const player of players) {
        if (player.user_id) {
            await sendPushNotification(player.user_id, payload);
        }
    }
}

export interface Subscriber {
    id: string;
    name: string;
    avatar_url: string;
    subscribed_at: string;
}

export async function getSubscribers(): Promise<Subscriber[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('subscribers_view')
        .select('*');
    
    if (error) {
        console.error("Failed to fetch subscribers:", error);
        return [];
    }

    return data as Subscriber[];
}

export async function getUnlinkedPlayers(): Promise<Player[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .is('user_id', null)
    .order('name', { ascending: true });
    
  if (error) {
    console.error("Failed to fetch unlinked players:", error);
    return [];
  }
  return data as Player[];
}

export async function linkProfile(playerId: string, userId: string): Promise<{ success: boolean, error?: any }> {
    const supabase = createClient();
    const { error } = await supabase
        .from('players')
        .update({ user_id: userId })
        .eq('id', playerId);

    if (error) {
        console.error(`Failed to link profile for player ${playerId}:`, error);
        return { success: false, error };
    }
    
    revalidatePath('/');
    return { success: true };
}

// User Profile Actions
export async function updateUserProfile(playerId: string, profileData: UserProfileUpdate): Promise<{ success: boolean, error?: any }> {
    const supabase = createClient();
    const { error } = await supabase
        .from('players')
        .update(profileData)
        .eq('id', playerId);

    if (error) {
        console.error(`Failed to update profile for player ${playerId}:`, error);
        return { success: false, error };
    }
    revalidatePath('/profile');
    return { success: true };
}


export async function updateUserAuth(newEmail?: string, newPassword?: string): Promise<{ success: boolean, error?: any }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: { message: "Utilisateur non authentifié" }};
    }

    const updateData: any = {};
    if (newEmail) updateData.email = newEmail;
    if (newPassword) updateData.password = newPassword;

    if (Object.keys(updateData).length === 0) {
        return { success: true }; // Nothing to update
    }

    const { error } = await supabase.auth.updateUser(updateData);
    
    if (error) {
        console.error("Failed to update user auth:", error);
        return { success: false, error };
    }

    // If email was changed, also update the 'email' column in the 'players' table
    if (newEmail) {
        const { error: playerUpdateError } = await supabase
            .from('players')
            .update({ email: newEmail })
            .eq('user_id', user.id);
            
        if(playerUpdateError) {
             console.error("Failed to update email in player profile:", playerUpdateError);
             // This is not a fatal error, the auth email was updated. We can just log it.
        }
    }
    
    revalidatePath('/profile');
    return { success: true };
}
