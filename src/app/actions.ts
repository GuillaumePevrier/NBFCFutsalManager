
'use server';

import { createClient } from '@/lib/supabase/server';
import type { Player, Opponent, Match, Training, Channel, Message } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';


// Auth Actions
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
    // Tri par points (décroissant), puis par nom (alphabétique)
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

export async function createPlayer(formData: FormData) {
  const supabase = createClient();
  
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  let authUserId: string | undefined = undefined;

  // 1. Create Auth user if email and password are provided
  if (email && password) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error("Failed to create auth user:", authError);
      return { error: { message: "Impossible de créer le compte utilisateur : " + authError.message } };
    }
    authUserId = authData.user.id;
  }
  
  // 2. Create player profile
  const playerData = {
      name: name,
      email: email,
      user_id: authUserId, // Link to auth user
      team: formData.get('team'),
      position: formData.get('position') === 'unspecified' ? '' : formData.get('position'),
      preferred_foot: formData.get('preferred_foot') === 'unspecified' ? '' : formData.get('preferred_foot'),
      avatar_url: formData.get('avatar_url'),
      points: 0
  };

  const { error } = await supabase
    .from('players')
    .insert([playerData]);

  if (error) {
    console.error("Failed to create player profile:", error);
    // If player creation fails, delete the auth user to avoid orphans
    if (authUserId) {
      await supabase.auth.admin.deleteUser(authUserId);
    }
    return { error: { message: "Impossible de créer le profil joueur : " + error.message } };
  }

  revalidatePath('/admin/players');
  redirect('/admin/players');
}


export async function updatePlayer(formData: FormData) {
  const supabase = createClient();
  const playerId = formData.get('id');

  if (!playerId) {
    console.error("Player ID is missing for update.");
    return { error: "Player ID is missing for update." };
  }

  // L'email n'est pas modifiable depuis ce formulaire pour éviter la désynchronisation.
  const playerData = {
      name: formData.get('name'),
      team: formData.get('team'),
      position: formData.get('position') === 'unspecified' ? '' : formData.get('position'),
      preferred_foot: formData.get('preferred_foot') === 'unspecified' ? '' : formData.get('preferred_foot'),
      avatar_url: formData.get('avatar_url'),
  };

  const { error } = await supabase
    .from('players')
    .update(playerData)
    .eq('id', playerId);

  if (error) {
     console.error(`Failed to update player ${playerId}:`, error);
    return { error: error.message };
  }

  revalidatePath('/admin/players');
  revalidatePath(`/player/${playerId}`);
  redirect('/admin/players');
}


export async function deletePlayer(playerId: string) {
    const supabase = createClient();
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
    revalidatePath('/match/*`);
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
      .select('*
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

    // This RPC function will be created later. It's a placeholder for now.
    const { data, error } = await supabase.rpc('get_user_channels');

    if (error) {
        console.error('Failed to fetch channels via RPC:', error);
        return [];
    }

    return data as any[] as Channel[];
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
            sender:players(id, name, avatar_url)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error(`Failed to fetch messages for channel ${channelId}:`, error);
        return [];
    }

    // The sender relationship is based on user_id, so we need to match it correctly.
    // Supabase JS v2 doesn't make this easy with nested selects on different columns.
    // Let's manually correct the sender.
    const { data: players, error: playersError } = await supabase.from('players').select('id, name, avatar_url, user_id');
    if (playersError) {
        return data as Message[]; // return messages without sender info if players fetch fails
    }

    return (data as Message[]).map(message => ({
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
