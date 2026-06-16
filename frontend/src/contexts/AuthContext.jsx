import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Listen for changes on auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signUp = async (email, password, username) => {
        // Supabase auth stores user data
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                }
            }
        });

        if (error) throw error;

        // Create profile entry
        if (data?.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    { id: data.user.id, username: username }
                ]);

            if (profileError) {
                console.error('Error creating profile:', profileError);
                // Depending on requirements, we could fail the signup or ignore
            }
        }
        return { data, error };
    }

    const signIn = async (email, password) => {
        return supabase.auth.signInWithPassword({ email, password })
    }

    const signOut = async () => {
        setDietPlan(null)
        setDietPlanLoaded(false)
        return supabase.auth.signOut()
    }

    const [dietPlan, setDietPlan] = useState(null)
    const [dietPlanLoaded, setDietPlanLoaded] = useState(false)

    const value = {
        signUp,
        signIn,
        signOut,
        user,
        loading,
        dietPlan,
        setDietPlan,
        dietPlanLoaded,
        setDietPlanLoaded
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
