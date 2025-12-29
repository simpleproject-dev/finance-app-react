import { supabase } from '../lib/supabase'

export const transactionService = {
  // Get all transactions for current user
  async getTransactions(limit = 50) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: 'No user' }

    // First, get transactions without joining
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching transactions:', error)
      return { data: [], error }
    }

    // Then, fetch categories separately and match them
    if (data && data.length > 0) {
      // Get unique category IDs from transactions
      const categoryIds = [...new Set(data.map(t => t.category_id).filter(id => id))];

      let categories = [];
      if (categoryIds.length > 0) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, name, color')
          .in('id', categoryIds)
          .eq('user_id', user.id);

        if (categoryError) {
          console.error('Error fetching categories for transactions:', categoryError);
          // Continue with transactions even if categories fail to load
        } else {
          categories = categoryData || [];
        }
      }

      // Then, fetch sources separately and match them
      let sources = [];
      if (data && data.length > 0) {
        // Get unique source IDs from transactions
        const sourceIds = [...new Set(data.map(t => t.source_id).filter(id => id))];

        if (sourceIds.length > 0) {
          const { data: sourceData, error: sourceError } = await supabase
            .from('sources')
            .select('id, name, type, color')
            .in('id', sourceIds)
            .eq('user_id', user.id);

          if (sourceError) {
            console.error('Error fetching sources for transactions:', sourceError);
            // Continue with transactions even if sources fail to load
          } else {
            sources = sourceData || [];
          }
        }
      }

      // Map categories and sources to transactions
      const transactionsWithCategoriesAndSources = data.map(transaction => {
        const category = categories.find(cat => cat.id === transaction.category_id);
        const source = sources.find(s => s.id === transaction.source_id);
        return {
          ...transaction,
          categories: category || null,
          sources: source || null
        };
      });

      return { data: transactionsWithCategoriesAndSources, error: null };
    }

    return { data, error: null };
  },

  // Get transaction by ID
  async getTransaction(id) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'No user' }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching transaction:', error)
      return { data: null, error }
    }

    // If transaction has a category_id, fetch the category info
    let categoryData = null;
    if (data && data.category_id) {
      const { data: categoryResult, error: categoryError } = await supabase
        .from('categories')
        .select('id, name, color')
        .eq('id', data.category_id)
        .eq('user_id', user.id)
        .single();

      if (categoryError) {
        console.error('Error fetching category for transaction:', categoryError);
      } else {
        categoryData = categoryResult;
      }
    }

    // If transaction has a source_id, fetch the source info
    let sourceData = null;
    if (data && data.source_id) {
      const { data: sourceResult, error: sourceError } = await supabase
        .from('sources')
        .select('id, name, type, color')
        .eq('id', data.source_id)
        .eq('user_id', user.id)
        .single();

      if (sourceError) {
        console.error('Error fetching source for transaction:', sourceError);
      } else {
        sourceData = sourceResult;
      }
    }

    return {
      data: {
        ...data,
        categories: categoryData,
        sources: sourceData
      },
      error: null
    };
  },

  // Create new transaction
  async createTransaction(transaction) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'No user' }
    
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...transaction,
        user_id: user.id
      })
      .select()
      .single()
    
    return { data, error }
  },

  // Update transaction
  async updateTransaction(id, updates) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'No user' }
    
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    
    return { data, error }
  },

  // Delete transaction
  async deleteTransaction(id) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No user' }
    
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    return { error }
  },

  // Get summary stats
  async getSummary() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: null, error: 'No user' }

      // Get total income
      const { data: incomeData, error: incomeError } = await supabase
        .from('transactions')
        .select('amount, source_id')
        .eq('user_id', user.id)
        .eq('type', 'income')

      if (incomeError) {
        console.error('Error fetching income data:', incomeError)
        return { data: null, error: incomeError }
      }

      // Get total expense
      const { data: expenseData, error: expenseError } = await supabase
        .from('transactions')
        .select('amount, source_id')
        .eq('user_id', user.id)
        .eq('type', 'expense')

      if (expenseError) {
        console.error('Error fetching expense data:', expenseError)
        return { data: null, error: expenseError }
      }

      // Get sources data for summary
      const allSourceIds = [
        ...(incomeData?.map(t => t.source_id).filter(id => id) || []),
        ...(expenseData?.map(t => t.source_id).filter(id => id) || [])
      ];

      let sourcesSummary = {};
      if (allSourceIds.length > 0) {
        const { data: sourcesData, error: sourcesError } = await supabase
          .from('sources')
          .select('id, name')
          .in('id', [...new Set(allSourceIds)])
          .eq('user_id', user.id);

        if (!sourcesError && sourcesData) {
          sourcesData.forEach(source => {
            sourcesSummary[source.id] = {
              name: source.name,
              income: 0,
              expense: 0
            };
          });
        }
      }

      // Calculate income by source
      incomeData?.forEach(t => {
        if (t.source_id && sourcesSummary[t.source_id]) {
          sourcesSummary[t.source_id].income += parseFloat(t.amount);
        }
      });

      // Calculate expense by source
      expenseData?.forEach(t => {
        if (t.source_id && sourcesSummary[t.source_id]) {
          sourcesSummary[t.source_id].expense += parseFloat(t.amount);
        }
      });

      const totalIncome = incomeData?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
      const totalExpense = expenseData?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
      const balance = totalIncome - totalExpense

      return {
        data: {
          totalIncome,
          totalExpense,
          balance,
          transactionCount: (incomeData?.length || 0) + (expenseData?.length || 0),
          sourcesSummary // Include sources summary in the response
        },
        error: null
      }
    } catch (error) {
      console.error('Error in getSummary:', error)
      return { data: null, error: error.message }
    }
  }
}