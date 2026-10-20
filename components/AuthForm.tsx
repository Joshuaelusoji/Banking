
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import CustomInput from './CustomInput';
import { authFormSchema } from '@/lib/utils';
import { signIn, signUp } from '@/lib/actions/user.actions';

const AuthForm = ({ type }: { type: string }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = authFormSchema(type);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      if (type === 'sign-up') {
        const userData = {
          firstName: data.firstName!,
          lastName: data.lastName!,
          address1: data.address1!,
          city: data.city!,
          state: data.state!,
          postalCode: data.postalCode!,
          dateOfBirth: data.dateOfBirth!,
          nin: data.nin!,
          email: data.email,
          password: data.password,
        };

        const newUser = await signUp(userData);

        if (newUser) {
          router.push('/');
        }
      } else if (type === 'sign-in') {
        const response = await signIn({
          email: data.email,
          password: data.password,
        });

        if (response) {
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <section className="auth-form">
        <header className="flex flex-col gap-5 md:gap-8">
          <Link href="/" className="cursor-pointer flex items-center gap-1">
            <Image
                src="/icons/logo.svg" width={34} height={34} alt="Mercury Bank logo"
            />

            <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">
              Mercury Bank
            </h1>
          </Link>

          <div className="flex flex-col gap-1 md:gap-3">
            <h1 className="text-24 text-center lg:text-36 font-semibold text-gray-900">
              {type === 'sign-in' ? 'Sign In' : 'Create Your Account'}
            </h1>

            <p className="text-16 text-center font-normal text-gray-600">
              {type === 'sign-in'
                  ? 'Welcome back. Sign in to continue.'
                  : 'Enter your details to get started.'}
            </p>
          </div>
        </header>

        <Form {...form}>
          <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
          >
            {type === 'sign-up' && (
                <>
                  <div className="flex gap-4">
                    <CustomInput
                        control={form.control}
                        name="firstName"
                        label="First Name"
                        placeholder="Enter your first name"
                    />

                    <CustomInput
                        control={form.control}
                        name="lastName"
                        label="Last Name"
                        placeholder="Enter your last name"
                    />
                  </div>

                  <CustomInput
                      control={form.control}
                      name="address1"
                      label="Residential Address"
                      placeholder="Enter your address in Nigeria"
                  />

                  <CustomInput
                      control={form.control}
                      name="city"
                      label="City or Town"
                      placeholder="Example: Lagos"
                  />

                  <div className="flex gap-4">
                    <CustomInput
                        control={form.control}
                        name="state"
                        label="State"
                        placeholder="Example: Lagos"
                    />

                    <CustomInput
                        control={form.control}
                        name="postalCode"
                        label="Postal Code"
                        placeholder="Enter your postcode"
                    />
                  </div>

                  <CustomInput
                      control={form.control}
                      name="dateOfBirth"
                      label="Date of Birth"
                      placeholder="YYYY-MM-DD"
                  />

                  <CustomInput
                      control={form.control}
                      name="nin"
                      label="National Identification Number (NIN)"
                      placeholder="Enter your NIN"
                  />
                </>
            )}

            <CustomInput
                control={form.control}
                name="email"
                label="Email Address"
                placeholder="Enter your email"
            />

            <CustomInput
                control={form.control}
                name="password"
                label="Password"
                placeholder="Enter your password"
            />

            <Button
                type="submit"
                disabled={isLoading}
                className="form-btn"
            >
              {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    &nbsp; Loading...
                  </>
              ) : type === 'sign-in' ? (
                  'Sign In'
              ) : (
                  'Create Account'
              )}
            </Button>
          </form>
        </Form>

        <footer className="flex justify-center gap-1">
          <p className="text-14 font-normal text-gray-600">
            {type === 'sign-in'
                ? "Don't have an account?"
                : 'Already have an account?'}
          </p>

          <Link
              href={type === 'sign-in' ? '/sign-up' : '/sign-in'}
              className="form-link"
          >
            {type === 'sign-in' ? 'Sign up' : 'Sign in'}
          </Link>
        </footer>
      </section>
  );
};

export default AuthForm;
