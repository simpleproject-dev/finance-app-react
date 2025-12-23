import { supabase } from '../lib/supabase'

export const categoryService = {
  // Get all categories for current user
  async getCategories() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No user found')
        return { data: [], error: 'No user' }
      }
      
      console.log('Fetching categories for user:', user.id)
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('type', { ascending: false })
        .order('name', { ascending: true })
      
      if (error) {
        console.error('Error fetching categories:', error)
        return { data: [], error }
      }
      
      console.log('Categories fetched:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Exception in getCategories:', error)
      return { data: [], error }
    }
  },

  // Get categories by type
  async getCategoriesByType(type) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: 'No user' }
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', type)
      .order('name')
    
    return { data, error }
  },

  // Create new category
  async createCategory(category) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'No user' }
    
    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...category,
        user_id: user.id
      })
      .select()
      .single()
    
    return { data, error }
  }
}
