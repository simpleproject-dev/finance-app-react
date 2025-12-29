import { supabase } from '../lib/supabase'

export const sourceService = {
  // Get all sources for current user
  async getSources() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No user found')
        return { data: [], error: 'No user' }
      }

      console.log('Fetching sources for user:', user.id)

      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching sources:', error)
        return { data: [], error }
      }

      console.log('Sources fetched:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Exception in getSources:', error)
      return { data: [], error }
    }
  },

  // Get source by ID
  async getSource(id) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'No user' }

    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching source:', error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Create new source
  async createSource(source) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'No user' }

    const { data, error } = await supabase
      .from('sources')
      .insert({
        ...source,
        user_id: user.id
      })
      .select()
      .single()

    return { data, error }
  },

  // Update source
  async updateSource(id, updates) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'No user' }

    const { data, error } = await supabase
      .from('sources')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    return { data, error }
  },

  // Delete source
  async deleteSource(id) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No user' }

    const { error } = await supabase
      .from('sources')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    return { error }
  }
}